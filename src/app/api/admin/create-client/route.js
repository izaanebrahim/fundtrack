import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, adminToken } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration missing service role key.' }, { status: 500 });
    }

    // 1. Verify the requester is actually an admin
    const standardSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Verify token
    const { data: { user }, error: authError } = await standardSupabase.auth.getUser(adminToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized request' }, { status: 401 });
    }

    // 2. Initialize the Supabase Admin Client using the Service Role Key
    // This allows us to create users and bypass RLS to check the caller's role safely.
    const adminAuthClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify role in the database using service role (bypasses RLS)
    const { data: adminProfile } = await adminAuthClient
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    // 3. Create the user in auth.users
    const { data: newAuthUser, error: createUserError } = await adminAuthClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm the email so they can log in immediately
    });

    if (createUserError) {
      return NextResponse.json({ error: createUserError.message }, { status: 400 });
    }

    // 4. Create the corresponding record in public.clients
    const { error: dbError } = await adminAuthClient.from('clients').insert([{
      id: newAuthUser.user.id,
      name: name,
      email: email,
      phone: phone || null,
      role: 'client'
    }]);

    if (dbError) {
      // Rollback auth user creation if DB insert fails
      await adminAuthClient.auth.admin.deleteUser(newAuthUser.user.id);
      return NextResponse.json({ error: 'Failed to create database profile, user creation rolled back.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Client created successfully.' });

  } catch (error) {
    console.error('Error in create-client API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
