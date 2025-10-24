import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to verify user authentication
async function verifyAuth(authHeader: string | null): Promise<{ userId: string; email: string; role: string } | null> {
  if (!authHeader) return null;
  
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  
  // TEMPORARY: Handle hardcoded admin token
  if (token === 'admin-token') {
    return {
      userId: 'admin-hardcoded',
      email: 'admin@buenaventura.gov.co',
      role: 'admin'
    };
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  
  // Get user profile to get role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  return { 
    userId: user.id, 
    email: user.email ?? '',
    role: profile?.role ?? 'ciudadano'
  };
}

// Helper function to check if user is admin
function isAdmin(auth: { userId: string; email: string; role: string } | null): boolean {
  return auth?.role === 'admin';
}

// Health check endpoint
app.get("/make-server-e2de53ff/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

// Sign up new user
app.post("/make-server-e2de53ff/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Por favor completa todos los campos requeridos' }, 400);
    }
    
    if (password.length < 6) {
      return c.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, 400);
    }
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.find(u => u.email === email);
    
    if (userExists) {
      return c.json({ error: 'Ya existe una cuenta con este correo electrónico. Por favor inicia sesión o recupera tu contraseña.' }, 400);
    }
    
    // Check if this is admin email
    const isAdminEmail = email === 'admin@buenaventura.gov.co';
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification
      user_metadata: {
        name,
        role: isAdminEmail ? 'admin' : 'ciudadano'
      },
    });
    
    if (error) {
      console.error('Error creating user:', error);
      return c.json({ error: error.message || 'Error al crear usuario' }, 400);
    }
    
    if (!data.user) {
      return c.json({ error: 'Error al crear usuario' }, 400);
    }
    
    // Update profile with role (the trigger should create it, but let's make sure)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email,
        name,
        role: isAdminEmail ? 'admin' : 'ciudadano'
      });
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
    }
    
    // Send verification email
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
    });
    
    if (emailError) {
      console.error('Error sending verification email:', emailError);
    }
    
    return c.json({
      message: 'Usuario creado exitosamente. Revisa tu correo para verificar tu cuenta.',
      requiresVerification: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role: isAdminEmail ? 'admin' : 'ciudadano'
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Error al crear cuenta' }, 500);
  }
});

// Sign in user
app.post("/make-server-e2de53ff/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Por favor ingresa email y contraseña' }, 400);
    }
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return c.json({ error: 'Por favor verifica tu correo electrónico antes de iniciar sesión' }, 400);
      }
      if (error.message.includes('Invalid login credentials')) {
        return c.json({ error: 'Correo o contraseña incorrectos' }, 400);
      }
      return c.json({ error: error.message }, 400);
    }
    
    if (!data.user || !data.session) {
      return c.json({ error: 'Error al iniciar sesión' }, 400);
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('Error getting profile:', profileError);
      return c.json({ error: 'Error al obtener perfil de usuario' }, 400);
    }
    
    return c.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    });
    
  } catch (error) {
    console.error('Signin error:', error);
    return c.json({ error: 'Error al iniciar sesión' }, 500);
  }
});

// Get current user
app.get("/make-server-e2de53ff/auth/me", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth) {
      return c.json({ error: 'No autenticado' }, 401);
    }
    
    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', auth.userId)
      .single();
    
    if (error || !profile) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }
    
    return c.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Error al obtener usuario' }, 500);
  }
});

// ==================== REPORTS ROUTES ====================

// Get all reports
app.get("/make-server-e2de53ff/reports", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    
    let query = supabase
      .from('reports')
      .select(`
        *,
        user:profiles!reports_user_id_fkey(id, name, email),
        entity:entities(id, name, category, contact_email, contact_phone)
      `)
      .order('created_at', { ascending: false });
    
    // If not admin, only show public reports or user's own reports
    if (!auth || !isAdmin(auth)) {
      if (auth) {
        query = query.or(`is_public.eq.true,user_id.eq.${auth.userId}`);
      } else {
        query = query.eq('is_public', true);
      }
    }
    
    const { data: reports, error } = await query;
    
    if (error) {
      console.error('Error getting reports:', error);
      return c.json({ error: 'Error al obtener reportes' }, 500);
    }
    
    // Transform to match expected format
    const transformedReports = (reports || []).map((report: any) => ({
      id: report.id,
      userId: report.user_id,
      userName: report.user?.name || 'Usuario',
      userEmail: report.user?.email || '',
      title: report.title,
      description: report.description,
      category: report.category,
      status: report.status,
      priority: report.priority || 'media',
      entityId: report.entity_id || '',
      entityName: report.entity?.name || report.entity_name || 'Sin asignar',
      location: report.location_address || '',
      locationLat: report.location_lat,
      locationLng: report.location_lng,
      images: report.images || [],
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      resolvedAt: report.resolved_at,
      isAnonymous: report.is_anonymous || false,
      isPublic: report.is_public !== false
    }));
    
    return c.json({ reports: transformedReports });
    
  } catch (error) {
    console.error('Get reports error:', error);
    return c.json({ error: 'Error al obtener reportes' }, 500);
  }
});

// Create new report
app.post("/make-server-e2de53ff/reports", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth) {
      return c.json({ error: 'No autenticado' }, 401);
    }
    
    const { title, description, category, entityId, entityName, location, locationLat, locationLng, images } = await c.req.json();
    
    if (!title || !description || !category) {
      return c.json({ error: 'Título, descripción y categoría son requeridos' }, 400);
    }
    
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        user_id: auth.userId,
        title,
        description,
        category,
        entity_id: entityId || null,
        entity_name: entityName || 'Sin asignar',
        location_address: location || null,
        location_lat: locationLat || null,
        location_lng: locationLng || null,
        images: images || [],
        status: 'pendiente',
        priority: 'media',
        is_public: true,
        is_anonymous: false
      })
      .select(`
        *,
        user:profiles!reports_user_id_fkey(id, name, email),
        entity:entities(id, name, category)
      `)
      .single();
    
    if (error) {
      console.error('Error creating report:', error);
      return c.json({ error: 'Error al crear reporte' }, 500);
    }
    
    // Transform to match expected format
    const transformedReport = {
      id: report.id,
      userId: report.user_id,
      userName: report.user?.name || 'Usuario',
      userEmail: report.user?.email || '',
      title: report.title,
      description: report.description,
      category: report.category,
      status: report.status,
      priority: report.priority || 'media',
      entityId: report.entity_id || '',
      entityName: report.entity?.name || report.entity_name || 'Sin asignar',
      location: report.location_address || '',
      locationLat: report.location_lat,
      locationLng: report.location_lng,
      images: report.images || [],
      createdAt: report.created_at,
      updatedAt: report.updated_at
    };
    
    return c.json({ report: transformedReport });
    
  } catch (error) {
    console.error('Create report error:', error);
    return c.json({ error: 'Error al crear reporte' }, 500);
  }
});

// Update report
app.put("/make-server-e2de53ff/reports/:id", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth) {
      return c.json({ error: 'No autenticado' }, 401);
    }
    
    const reportId = c.req.param('id');
    const updates = await c.req.json();
    
    // Check if report exists and user has permission
    const { data: existingReport } = await supabase
      .from('reports')
      .select('user_id')
      .eq('id', reportId)
      .single();
    
    if (!existingReport) {
      return c.json({ error: 'Reporte no encontrado' }, 404);
    }
    
    // Only owner or admin can update
    if (existingReport.user_id !== auth.userId && !isAdmin(auth)) {
      return c.json({ error: 'No tienes permiso para actualizar este reporte' }, 403);
    }
    
    // Build update object
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.category) updateData.category = updates.category;
    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.entityId !== undefined) {
      updateData.entity_id = updates.entityId || null;
    }
    if (updates.entityName) updateData.entity_name = updates.entityName;
    if (updates.location) updateData.location_address = updates.location;
    if (updates.locationLat !== undefined) updateData.location_lat = updates.locationLat;
    if (updates.locationLng !== undefined) updateData.location_lng = updates.locationLng;
    if (updates.images) updateData.images = updates.images;
    if (updates.adminNotes) updateData.admin_notes = updates.adminNotes;
    
    // If status is being set to 'resuelto', set resolved_at
    if (updates.status === 'resuelto' && !existingReport.resolved_at) {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = auth.userId;
    }
    
    const { data: report, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select(`
        *,
        user:profiles!reports_user_id_fkey(id, name, email),
        entity:entities(id, name, category)
      `)
      .single();
    
    if (error) {
      console.error('Error updating report:', error);
      return c.json({ error: 'Error al actualizar reporte' }, 500);
    }
    
    return c.json({ 
      report: {
        id: report.id,
        status: report.status,
        entityId: report.entity_id,
        entityName: report.entity?.name || report.entity_name
      }
    });
    
  } catch (error) {
    console.error('Update report error:', error);
    return c.json({ error: 'Error al actualizar reporte' }, 500);
  }
});

// Delete report
app.delete("/make-server-e2de53ff/reports/:id", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth) {
      return c.json({ error: 'No autenticado' }, 401);
    }
    
    const reportId = c.req.param('id');
    
    // Check if report exists and user has permission
    const { data: existingReport } = await supabase
      .from('reports')
      .select('user_id')
      .eq('id', reportId)
      .single();
    
    if (!existingReport) {
      return c.json({ error: 'Reporte no encontrado' }, 404);
    }
    
    // Only owner or admin can delete
    if (existingReport.user_id !== auth.userId && !isAdmin(auth)) {
      return c.json({ error: 'No tienes permiso para eliminar este reporte' }, 403);
    }
    
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);
    
    if (error) {
      console.error('Error deleting report:', error);
      return c.json({ error: 'Error al eliminar reporte' }, 500);
    }
    
    return c.json({ message: 'Reporte eliminado' });
    
  } catch (error) {
    console.error('Delete report error:', error);
    return c.json({ error: 'Error al eliminar reporte' }, 500);
  }
});

// ==================== ENTITIES ROUTES ====================

// Get all entities
app.get("/make-server-e2de53ff/entities", async (c) => {
  try {
    const { data: entities, error } = await supabase
      .from('entities')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error getting entities:', error);
      return c.json({ error: 'Error al obtener entidades' }, 500);
    }
    
    // Transform to match expected format
    const transformedEntities = (entities || []).map((entity: any) => ({
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      category: entity.category,
      email: entity.contact_email || '',
      phone: entity.contact_phone || '',
      website: entity.website || '',
      address: entity.address || '',
      createdAt: entity.created_at
    }));
    
    return c.json({ entities: transformedEntities });
    
  } catch (error) {
    console.error('Get entities error:', error);
    return c.json({ error: 'Error al obtener entidades' }, 500);
  }
});

// Update entities (admin only)
app.put("/make-server-e2de53ff/entities", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth || !isAdmin(auth)) {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    const { entities } = await c.req.json();
    
    if (!Array.isArray(entities)) {
      return c.json({ error: 'Formato de entidades inválido' }, 400);
    }
    
    // Delete all existing entities first
    await supabase.from('entities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Insert new entities
    const entitiesToInsert = entities.map((entity: any) => ({
      name: entity.name,
      description: entity.description || '',
      category: entity.category || 'Otros',
      contact_email: entity.email || '',
      contact_phone: entity.phone || '',
      website: entity.website || '',
      address: entity.address || '',
      is_active: true
    }));
    
    const { data: newEntities, error } = await supabase
      .from('entities')
      .insert(entitiesToInsert)
      .select();
    
    if (error) {
      console.error('Error updating entities:', error);
      return c.json({ error: 'Error al actualizar entidades' }, 500);
    }
    
    // Transform to match expected format
    const transformedEntities = (newEntities || []).map((entity: any) => ({
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      category: entity.category,
      email: entity.contact_email || '',
      phone: entity.contact_phone || '',
      website: entity.website || '',
      address: entity.address || '',
      createdAt: entity.created_at
    }));
    
    return c.json({ entities: transformedEntities });
    
  } catch (error) {
    console.error('Update entities error:', error);
    return c.json({ error: 'Error al actualizar entidades' }, 500);
  }
});

// ==================== COMMENTS ROUTES ====================

// Get comments for a report
app.get("/make-server-e2de53ff/reports/:reportId/comments", async (c) => {
  try {
    const reportId = c.req.param('reportId');
    
    console.log('Fetching comments for report:', reportId);
    
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!comments_user_id_fkey(id, name, email)
      `)
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting comments:', error);
      return c.json({ error: 'Error al obtener comentarios' }, 500);
    }
    
    // Transform to match expected format
    const transformedComments = (comments || []).map((comment: any) => ({
      id: comment.id,
      reportId: comment.report_id,
      userId: comment.user_id,
      userName: comment.user?.name || 'Usuario',
      userEmail: comment.user?.email || '',
      text: comment.text,
      createdAt: comment.created_at
    }));
    
    return c.json({ comments: transformedComments });
    
  } catch (error) {
    console.error('Get comments error:', error);
    return c.json({ error: 'Error al obtener comentarios' }, 500);
  }
});

// Add comment to a report
app.post("/make-server-e2de53ff/reports/:reportId/comments", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth) {
      return c.json({ error: 'No autenticado' }, 401);
    }
    
    const reportId = c.req.param('reportId');
    const { text } = await c.req.json();
    
    if (!text || !text.trim()) {
      return c.json({ error: 'El comentario no puede estar vacío' }, 400);
    }
    
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        report_id: reportId,
        user_id: auth.userId,
        text: text.trim(),
        is_admin: isAdmin(auth)
      })
      .select(`
        *,
        user:profiles!comments_user_id_fkey(id, name, email)
      `)
      .single();
    
    if (error) {
      console.error('Error adding comment:', error);
      return c.json({ error: 'Error al agregar comentario' }, 500);
    }
    
    // Transform to match expected format
    const transformedComment = {
      id: comment.id,
      reportId: comment.report_id,
      userId: comment.user_id,
      userName: comment.user?.name || 'Usuario',
      userEmail: comment.user?.email || '',
      text: comment.text,
      createdAt: comment.created_at
    };
    
    return c.json({ comment: transformedComment });
    
  } catch (error) {
    console.error('Add comment error:', error);
    return c.json({ error: 'Error al agregar comentario' }, 500);
  }
});

// ==================== RATINGS ROUTES ====================

// Get rating for a report by user
app.get("/make-server-e2de53ff/reports/:reportId/rating", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth) {
      return c.json({ error: 'No autenticado' }, 401);
    }
    
    const reportId = c.req.param('reportId');
    
    const { data: rating, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', auth.userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error getting rating:', error);
      return c.json({ error: 'Error al obtener calificación' }, 500);
    }
    
    if (!rating) {
      return c.json({ rating: null });
    }
    
    return c.json({
      rating: {
        id: rating.id,
        reportId: rating.report_id,
        userId: rating.user_id,
        rating: rating.rating,
        comment: rating.comment || '',
        createdAt: rating.created_at
      }
    });
    
  } catch (error) {
    console.error('Get rating error:', error);
    return c.json({ error: 'Error al obtener calificación' }, 500);
  }
});

// Add or update rating for a report
app.post("/make-server-e2de53ff/reports/:reportId/rating", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth) {
      return c.json({ error: 'No autenticado' }, 401);
    }
    
    const reportId = c.req.param('reportId');
    const { rating, comment } = await c.req.json();
    
    if (!rating || rating < 1 || rating > 5) {
      return c.json({ error: 'La calificación debe ser entre 1 y 5 estrellas' }, 400);
    }
    
    // Upsert rating
    const { data: ratingData, error } = await supabase
      .from('ratings')
      .upsert({
        report_id: reportId,
        user_id: auth.userId,
        rating,
        comment: comment || ''
      }, {
        onConflict: 'report_id,user_id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding rating:', error);
      return c.json({ error: 'Error al agregar calificación' }, 500);
    }
    
    return c.json({
      rating: {
        id: ratingData.id,
        reportId: ratingData.report_id,
        userId: ratingData.user_id,
        rating: ratingData.rating,
        comment: ratingData.comment || '',
        createdAt: ratingData.created_at
      }
    });
    
  } catch (error) {
    console.error('Add rating error:', error);
    return c.json({ error: 'Error al agregar calificación' }, 500);
  }
});

// ==================== ADMIN ROUTES ====================

// Get all users (admin only)
app.get("/make-server-e2de53ff/admin/users", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth || !isAdmin(auth)) {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    // Get all users from profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting users:', error);
      return c.json({ error: 'Error al obtener usuarios' }, 500);
    }
    
    // Get report counts for each user
    const usersWithCounts = await Promise.all((profiles || []).map(async (profile: any) => {
      const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);
      
      // Get user from auth to check email_confirmed
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
      
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        isBlocked: !authUser?.user || authUser.user.banned_until !== null,
        emailVerified: authUser?.user?.email_confirmed_at !== null,
        totalReports: count || 0,
        createdAt: profile.created_at
      };
    }));
    
    return c.json({ users: usersWithCounts });
    
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Error al obtener usuarios' }, 500);
  }
});

// Update user (admin only)
app.put("/make-server-e2de53ff/admin/users/:id", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth || !isAdmin(auth)) {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    const userId = c.req.param('id');
    const { isBlocked, role } = await c.req.json();
    
    // Update user block status in Supabase Auth
    if (isBlocked !== undefined) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { ban_duration: isBlocked ? '876000h' : 'none' } // 100 years if blocked, none if unblocked
      );
      
      if (authError) {
        console.error('Error updating user auth:', authError);
        return c.json({ error: 'Error al actualizar estado de usuario' }, 500);
      }
    }
    
    // Update role in profiles
    if (role) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      
      if (profileError) {
        console.error('Error updating profile:', profileError);
        return c.json({ error: 'Error al actualizar rol de usuario' }, 500);
      }
    }
    
    return c.json({ message: 'Usuario actualizado' });
    
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Error al actualizar usuario' }, 500);
  }
});

// Get analytics (admin only)
app.get("/make-server-e2de53ff/admin/analytics", async (c) => {
  try {
    const auth = await verifyAuth(c.req.header('Authorization'));
    if (!auth || !isAdmin(auth)) {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    // Use the database function to get stats
    const { data: stats, error } = await supabase.rpc('get_dashboard_stats');
    
    if (error) {
      console.error('Error getting analytics:', error);
      // Fallback to manual queries
      const [
        { count: totalReports },
        { count: pendingReports },
        { count: inProgressReports },
        { count: resolvedReports },
        { count: totalUsers },
        { count: totalEntities }
      ] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pendiente'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'en_proceso'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resuelto'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('entities').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ]);
      
      return c.json({
        analytics: {
          totalReports: totalReports || 0,
          pendingReports: pendingReports || 0,
          inProgressReports: inProgressReports || 0,
          resolvedReports: resolvedReports || 0,
          totalUsers: totalUsers || 0,
          totalEntities: totalEntities || 0
        }
      });
    }
    
    return c.json({
      analytics: {
        totalReports: stats.total_reports || 0,
        pendingReports: stats.pending_reports || 0,
        inProgressReports: stats.in_progress_reports || 0,
        resolvedReports: stats.resolved_reports || 0,
        totalUsers: stats.total_users || 0,
        totalCitizens: stats.total_citizens || 0,
        totalAdmins: stats.total_admins || 0,
        totalEntities: stats.total_entities || 0,
        reportsThisMonth: stats.reports_this_month || 0,
        reportsThisWeek: stats.reports_this_week || 0
      }
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    return c.json({ error: 'Error al obtener analíticas' }, 500);
  }
});

// Handle all other routes
app.all("*", (c) => {
  return c.json({ error: "Ruta no encontrada" }, 404);
});

// Start the server
Deno.serve(app.fetch);
