CREATE TRIGGER schedule_status_changed_at
BEFORE UPDATE OF "status" ON "Schedule"
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION set_schedule_status_changed_at();

Et la fonction :

CREATE OR REPLACE FUNCTION set_schedule_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."statusChangedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;