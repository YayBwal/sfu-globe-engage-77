
import React from 'react';

interface QuickLink {
  title: string;
  url: string;
}

interface QuickLinksProps {
  links: QuickLink[];
}

export const QuickLinks: React.FC<QuickLinksProps> = ({ links }) => {
  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-4">Quick Links</h3>
      <ul className="space-y-2 text-sm">
        {links.map((link, index) => (
          <li key={index}>
            <a href={link.url} className="text-gray-700 hover:text-sfu-red">
              {link.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
