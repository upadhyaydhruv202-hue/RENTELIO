import Card from './Card';

const accents = ['brand', 'sky', 'amber', 'rose', 'violet', 'slate'];

export default function StatGrid({ items = [], columns = 'sm:grid-cols-2 xl:grid-cols-4' }) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {items.map((item, i) => (
        <Card
          key={item.title}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          accent={item.accent || accents[i % accents.length]}
        />
      ))}
    </div>
  );
}
