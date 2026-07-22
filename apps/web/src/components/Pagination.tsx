interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div style={styles.wrapper}>
      <button
        style={{ ...styles.button, ...(page <= 1 ? styles.buttonDisabled : {}) }}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      <span style={styles.label}>
        Page {page} of {totalPages}
      </span>
      <button
        style={{ ...styles.button, ...(page >= totalPages ? styles.buttonDisabled : {}) }}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "1rem",
  },
  button: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    background: "#fff",
    color: "#1a1a2e",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  label: {
    fontSize: "0.875rem",
    color: "#6c757d",
  },
};
