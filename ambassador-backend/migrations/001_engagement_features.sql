CREATE TABLE IF NOT EXISTS public.user_points (
  user_id INT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_enrollments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actividad_id INT NOT NULL REFERENCES public.actividades(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'inscrito',
  points_awarded INT NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, actividad_id)
);

INSERT INTO public.user_points (user_id, points)
SELECT id, 0 FROM public.users
ON CONFLICT (user_id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_points TO ambassador;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_enrollments TO ambassador;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ambassador;
