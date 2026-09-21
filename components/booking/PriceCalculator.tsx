'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {packages, siteConfig} from '@/lib/site';
import {trackEvent} from '@/lib/analytics';

type PackageKey = 'signature' | 'elite';

export function PriceCalculator(){
  const [pkg,setPkg] = useState<PackageKey>('signature');
  const [guests,setGuests] = useState<number>(siteConfig.groupMin);
  const total = useMemo(() => packages[pkg].price * guests, [pkg, guests]);

  const selectPackage = (value: PackageKey) => {
    setPkg(value);
    trackEvent('package_selected',{package:value});
  };

  const updateGuests = (value: string) => {
    const next = Math.min(8, Math.max(1, Number(value) || 1));
    setGuests(next);
    trackEvent('calculator_used',{
      package: pkg,
      guests: next,
      total: packages[pkg].price * next,
    });
  };

  return (
    <div className="card overflow-hidden p-0 md:p-0">
      <div className="bg-forest p-7 text-white md:p-9">
        <div className="eyebrow">Design your journey</div>
        <h3 className="serif mt-3 text-3xl md:text-4xl">A clear estimate, in seconds.</h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
          Choose your journey and the number of guests. Your estimate updates instantly.
        </p>
      </div>

      <div className="p-6 md:p-9">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-forest">
              Journey
              <select
                value={pkg}
                onChange={(event) => selectPackage(event.target.value as PackageKey)}
              >
                <option value="signature">Signature — $2,000 / guest</option>
                <option value="elite">Elite — $2,500 / guest</option>
              </select>
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-forest">
              Number of guests
              <input
                required
                type="number"
                min={1}
                max={8}
                step={1}
                value={guests}
                onChange={(event) => updateGuests(event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="mt-8 border-t border-forest/10 pt-7">
          <div className="text-xs font-bold tracking-[.18em] text-gold">ESTIMATED JOURNEY TOTAL</div>
          <div className="serif mt-2 text-5xl text-forest">\$${total.toLocaleString()}</div>
          <p className="mt-2 text-sm text-forest/55">Transparent journey estimate. Flights are not included.</p>
          <Link
            href={'/request-journey?package='+pkg+'&guests='+guests}
            onClick={() => trackEvent('request_started',{package:pkg,guests,total})}
            className="btn btn-primary mt-6"
          >
            Request this journey
          </Link>
        </div>
      </div>
    </div>
  );
}
