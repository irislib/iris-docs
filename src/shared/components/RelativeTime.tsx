export function RelativeTime({ time }: { time: number }) {
  // return short time (hours and minutes) for current day or date for previous days
  const date = new Date(time);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const text = isToday
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return <span title={date.toLocaleString()}>{text}</span>;
}
