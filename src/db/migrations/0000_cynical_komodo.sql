CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"course" varchar(255) NOT NULL,
	"year" varchar(255) NOT NULL,
	"gpa" integer NOT NULL,
	CONSTRAINT "students_email_unique" UNIQUE("email")
);
