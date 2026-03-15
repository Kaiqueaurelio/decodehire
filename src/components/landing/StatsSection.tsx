import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 50000, suffix: "+", label: "Currículos Analisados", prefix: "" },
  { value: 98, suffix: "%", label: "Precisão da IA", prefix: "" },
  { value: 3, suffix: "s", label: "Tempo Médio", prefix: "" },
  { value: 500, suffix: "+", label: "Empresas Usam", prefix: "" },
];

function useCountUp(target: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);
  return count;
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-16 bg-primary/5" ref={ref}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <StatCard key={s.label} stat={s} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat, visible }: { stat: typeof stats[number]; visible: boolean }) {
  const count = useCountUp(stat.value, visible);
  return (
    <div className="text-center">
      <p className="font-display text-3xl md:text-4xl font-bold text-primary">
        {stat.prefix}{count.toLocaleString("pt-BR")}{stat.suffix}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
    </div>
  );
}
