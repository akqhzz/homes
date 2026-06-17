'use client';

const KEYWORDS = [
  'Sold Prices', 'Houses for Sale', 'Condos for Sale', 'Townhouses for Sale', 'Home Appraisal',
  'Find an Agent', 'Houses', '3-Bed Houses', '2-Bed Condos', '1-Bed Condos', 'Condos for Rent',
  'Houses for Rent', 'Condos Under $500K', 'Houses Under $1M', 'Condos > $1,000,000',
  'Most Expensive Houses', 'Luxury Condos', 'Cheapest Condos in Toronto', 'Cheapest Houses in Toronto',
  'Downtown Toronto Condos',
];

const COLUMNS: { title: string; links: string[] }[] = [
  {
    title: 'Popular Cities',
    links: ['Toronto Real Estate', 'Vancouver Real Estate', 'Calgary Real Estate', 'Edmonton Real Estate', 'Ottawa Real Estate', 'Mississauga Real Estate', 'Winnipeg Real Estate', 'Halifax Real Estate', 'Hamilton Real Estate', 'Surrey Real Estate', 'Brampton Real Estate', 'Victoria Real Estate', 'Saskatoon Real Estate', 'Kelowna Real Estate', 'London Real Estate'],
  },
  {
    title: 'Condos for Sale in Canada',
    links: ['Toronto Condos for Sale', 'Vancouver Condos for Sale', 'Calgary Condos for Sale', 'Edmonton Condos for Sale', 'Ottawa Condos for Sale', 'Mississauga Condos for Sale', 'Brampton Condos for Sale', 'Hamilton Condos for Sale', 'Surrey Condos for Sale', 'London Condos for Sale', 'Halifax Condos for Sale', 'Victoria Condos for Sale', 'Kitchener Condos for Sale', 'Barrie Condos for Sale'],
  },
  {
    title: 'Popular Ontario Cities',
    links: ['Toronto Homes for Sale', 'Ottawa Homes for Sale', 'Mississauga Homes for Sale', 'Brampton Homes for Sale', 'Hamilton Homes for Sale', 'London Homes for Sale', 'Vaughan Homes for Sale', 'Markham Homes for Sale', 'Kitchener Homes for Sale', 'Windsor Homes for Sale', 'Oakville Homes for Sale', 'Burlington Homes for Sale', 'Whitby Homes for Sale', 'Guelph Homes for Sale'],
  },
  {
    title: 'Popular Real Estate Searches',
    links: ['MLS® Listings in Canada', 'Calgary MLS® Listings', 'Toronto Rentals', 'Houses for Sale in Canada', 'First-Time Home Buyer', 'Sold Prices in Canada', 'Real Estate Market Trends', 'Vancouver Townhouses', 'Ottawa Townhomes', 'Pre-Construction Homes', 'Canada Real Estate', 'New Houses for Sale', 'Luxury Homes in Toronto'],
  },
];

export default function HomeSeoSection() {
  return (
    <section className="w-full px-5 pt-14 lg:px-12 lg:pt-20">
      {/* Search by keywords */}
      <div className="rounded-[28px] bg-[var(--color-surface)] p-6 lg:p-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-12">
          <h2 className="shrink-0 type-title !text-[1.4rem] text-[var(--color-text-primary)] lg:w-52 lg:!text-[1.6rem]">
            Search by keywords
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {KEYWORDS.map((keyword) => (
              <button
                key={keyword}
                type="button"
                className="rounded-full bg-white px-4 py-2 type-label text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-brand-surface)] hover:text-[var(--color-brand-700)]"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Link directory */}
      <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="type-heading text-[var(--color-text-primary)]">{column.title}</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link}>
                  <button
                    type="button"
                    className="text-left type-body text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-brand-700)]"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
