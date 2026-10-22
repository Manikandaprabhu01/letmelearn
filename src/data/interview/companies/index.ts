import type { Company } from "../types";
import { coreCompanies } from "./core";
import { bigtechCompanies } from "./bigtech";
import { product2Companies } from "./product2";
import { indiaCompanies } from "./india";
import { product3Companies } from "./product3";
import { banksCompanies } from "./banks";
import { fintechCompanies } from "./fintech";
import { paymentsCompanies } from "./payments";

export const COMPANIES: Company[] = [
  ...coreCompanies,
  ...bigtechCompanies,
  ...product2Companies,
  ...indiaCompanies,
  ...product3Companies,
  ...banksCompanies,
  ...fintechCompanies,
  ...paymentsCompanies,
];

export function getCompany(id: string): Company | undefined {
  return COMPANIES.find((c) => c.id === id);
}
