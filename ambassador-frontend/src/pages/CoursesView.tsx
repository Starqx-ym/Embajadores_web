import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, LockKeyhole } from 'lucide-react';
import api from '../config/axiosConfig';

interface Course {
  id: number;
  title: string;
  description?: string;
  cost_points: number;
  provider?: string;
  redeemed: boolean;
}

export default function CoursesView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [points, setPoints] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    const [coursesRes, profileRes] = await Promise.all([
      api.get('/courses', { headers }),
      api.get('/users/me', { headers })
    ]);
    setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
    setPoints(Number(profileRes.data?.user?.points || 0));
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const redeem = async (id: number) => {
    try {
      await api.post(`/courses/${id}/redeem`, {}, { headers });
      setMessage('Curso canjeado correctamente.');
      load();
    } catch (error: any) {
      setMessage(error?.response?.data?.error || 'No se pudo canjear el curso.');
    }
  };

  return (
    <div className="panel-span">
      <div className="toolbar">
        <div>
          <h2>Cursos canjeables</h2>
          <p>Usa tus puntos para acceder a cursos y beneficios del programa.</p>
        </div>
        <span className="status-note">{points} pts disponibles</span>
      </div>

      {message && <div className="alert-inline neutral-alert">{message}</div>}

      <div className="course-grid">
        {courses.map(course => {
          const locked = points < course.cost_points && !course.redeemed;
          return (
            <article key={course.id} className="course-card">
              <div className="course-icon"><BookOpen size={22} /></div>
              <span className="badge-soft">{course.provider || 'Embajadores'}</span>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="course-footer">
                <strong>{course.cost_points} pts</strong>
                <button className="btn-primary" onClick={() => redeem(course.id)} disabled={course.redeemed || locked}>
                  {course.redeemed ? <><CheckCircle2 size={17} /> Canjeado</> : locked ? <><LockKeyhole size={17} /> Faltan puntos</> : 'Canjear'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
