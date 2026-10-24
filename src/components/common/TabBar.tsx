export interface TabBarItem<T extends string> {
  id: T;
  label: string;
  icon: string;
}

export function TabBar<T extends string>({ items, active, onSelect }: { items: readonly TabBarItem<T>[]; active: T; onSelect: (id: T) => void }) {
  return (
    <nav className="tabbar">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          className={t.id === active ? "on" : ""}
          onClick={() => onSelect(t.id)}
          aria-current={t.id === active ? "page" : undefined}
        >
          <span aria-hidden="true">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
