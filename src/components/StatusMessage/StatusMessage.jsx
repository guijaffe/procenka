import Button from '../ui/Button';
export default function StatusMessage({ loading, error, children, onRetry }) {
  return (
    <div
      className={`request-status${error ? ' request-status_error' : ''}`}
      role={error ? 'alert' : 'status'}
    >
      {loading && <span className='spinner-border spinner-border-sm me-2' aria-hidden='true' />}
      {error || children}
      {error && onRetry && (
        <Button variant='secondary' className='request-status__retry' onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  );
}
