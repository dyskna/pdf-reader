type Props = {
  message: string
}

// Komunikat błędu w stylu ostrzeżenia z projektu, z czerwoną linią z lewej
export function ErrorNotice({ message }: Props) {
  return (
    <p className="notice notice--error" role="alert">
      <strong>Nie udało się.</strong> {message}
    </p>
  )
}
