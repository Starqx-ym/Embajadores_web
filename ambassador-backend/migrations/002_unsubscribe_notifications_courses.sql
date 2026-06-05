ALTER TABLE public.activity_enrollments
  ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS public.coordinator_notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES public.users(id) ON DELETE SET NULL,
  actividad_id INT REFERENCES public.actividades(id) ON DELETE SET NULL,
  type VARCHAR(60) NOT NULL,
  message TEXT NOT NULL,
  reason TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cost_points INT NOT NULL DEFAULT 0,
  provider VARCHAR(120),
  status VARCHAR(50) NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_redemptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  points_spent INT NOT NULL DEFAULT 0,
  redeemed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

INSERT INTO public.courses (title, description, cost_points, provider)
VALUES
  ('Liderazgo estudiantil', 'Curso corto para fortalecer comunicacion, iniciativa y trabajo en equipo.', 80, 'Embajadores'),
  ('Organizacion de eventos', 'Aprende a planificar actividades, manejar cupos y medir participacion.', 120, 'Embajadores'),
  ('Comunicacion digital', 'Buenas practicas para difundir actividades y crear comunidad universitaria.', 100, 'Embajadores')
ON CONFLICT DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coordinator_notifications TO ambassador;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO ambassador;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_redemptions TO ambassador;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ambassador;
