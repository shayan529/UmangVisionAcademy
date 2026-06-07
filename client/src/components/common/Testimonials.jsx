import { useTranslation } from 'react-i18next';

const testimonials = [
  {
    nameKey: 'testimonials.items.priya.name',
    quoteKey: 'testimonials.items.priya.quote',
  },
  {
    nameKey: 'testimonials.items.mark.name',
    quoteKey: 'testimonials.items.mark.quote',
  },
  {
    nameKey: 'testimonials.items.lina.name',
    quoteKey: 'testimonials.items.lina.quote',
  },
];

const Testimonials = () => {
  const { t } = useTranslation();

  return (
    <section className="px-10 py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-100 mb-6">
          {t('testimonials.heading')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="bg-slate-800 p-6 rounded-2xl text-slate-300"
            >
              <p className="italic">“{t(testimonial.quoteKey)}”</p>
              <p className="mt-4 font-semibold text-slate-100">
                — {t(testimonial.nameKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
