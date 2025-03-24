/*
  Warnings:

  - A unique constraint covering the columns `[domain]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");
