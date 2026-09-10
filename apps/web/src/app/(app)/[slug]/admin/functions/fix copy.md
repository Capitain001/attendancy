          <Button
            disabled={!name.trim() || pending}
           onClick={() => onSubmit({ name: name.trim(), description: description.trim() || undefined })}
          >