import { packages } from '../site';
export type PackageKey='signature'|'elite';
export function calculateTotal(pkg:PackageKey, guests:number){if(!Number.isInteger(guests)||guests<1||guests>8)throw new Error('Guest count must be between 1 and 8.');return guests*packages[pkg].price}
