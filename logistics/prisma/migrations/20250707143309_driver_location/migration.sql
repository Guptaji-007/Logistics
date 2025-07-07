-- CreateTable
CREATE TABLE "driver_locations" (
    "driver_email" TEXT NOT NULL,
    "location" geography NOT NULL,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_locations_pkey" PRIMARY KEY ("driver_email")
);

-- AddForeignKey
ALTER TABLE "driver_locations" ADD CONSTRAINT "driver_locations_driver_email_fkey" FOREIGN KEY ("driver_email") REFERENCES "Driver"("email") ON DELETE CASCADE ON UPDATE NO ACTION;
