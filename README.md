datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Document {
  id             String          @id @default(uuid())
  title          String
  category       String
  version        String
  revision       String
  description    String
  fileUrl        String
  createdBy      String // ID of the user who created the document
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  changeRequests ChangeRequest[] // Relation to ChangeRequest
}

model ChangeRequest {
  id            String     @id @default(uuid())
  documentId    String // Foreign key to Document
  document      Document   @relation(fields: [documentId], references: [id], onDelete: Cascade)
  proposerId    String // Foreign key to User (proposer)
  proposer      User       @relation(fields: [proposerId], references: [id], onDelete: Cascade)
  departmentId  String // Foreign key to Department
  department    Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  section       String // Section or clause being changed
  justification String // Justification for the change
  status        String     @default("Pending") // Status: Pending, Approved, Declined
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model User {
  id               String          @id @default(uuid())
  email            String          @unique
  firstName        String
  lastName         String
  password         String
  roleId           String // Foreign key to Role
  role             Role            @relation(fields: [roleId], references: [id], onDelete: Cascade)
  departmentId     String // Foreign key to Department
  department       Department      @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  changeRequests   ChangeRequest[] // Relation to ChangeRequest
  headedDepartment Department?     @relation("DepartmentHead") // Opposite relation for Department.head
}

model Department {
  id             String          @id @default(uuid())
  name           String
  headId         String?         @unique // Foreign key to User (HOD) with @unique for one-to-one relation
  head           User?           @relation("DepartmentHead", fields: [headId], references: [id], onDelete: SetNull)
  users          User[] // Users in the department
  changeRequests ChangeRequest[] // Relation to ChangeRequest
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model Role {
  id          String   @id @default(uuid())
  name        String   @unique // Role name: MR, HOD, User
  description String?
  users       User[] // Users with this role
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
