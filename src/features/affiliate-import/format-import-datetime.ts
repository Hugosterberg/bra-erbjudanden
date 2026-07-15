type DateStyle = "medium" | "full";

export function formatImportDateTime(
  value: string | null,
  options: { dateStyle?: DateStyle } = {},
) {
  if (!value) {
    return "–";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: options.dateStyle ?? "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatImportDuration(startedAt: string, finishedAt: string | null) {
  if (!finishedAt) {
    return "Pågår";
  }

  const seconds = Math.round(
    (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );

  if (seconds < 60) {
    return `${seconds} s`;
  }

  return `${Math.round(seconds / 60)} min`;
}

export function formatErrorPreview(errors: string[], maxLength = 80) {
  if (errors.length === 0) {
    return "–";
  }

  const first = errors[0];
  const suffix = errors.length > 1 ? ` (+${errors.length - 1} till)` : "";

  if (first.length + suffix.length <= maxLength) {
    return `${first}${suffix}`;
  }

  return `${first.slice(0, maxLength - suffix.length - 1)}…${suffix}`;
}
