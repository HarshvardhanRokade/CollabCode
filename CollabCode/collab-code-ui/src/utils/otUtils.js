// Diff two strings and return OT operations
export function diffToOps(oldStr, newStr, version, userId) {
  const ops = [];

  let start = 0;
  while (
    start < oldStr.length &&
    start < newStr.length &&
    oldStr[start] === newStr[start]
  ) start++;

  let oldEnd = oldStr.length;
  let newEnd = newStr.length;
  while (
    oldEnd > start &&
    newEnd > start &&
    oldStr[oldEnd - 1] === newStr[newEnd - 1]
  ) { oldEnd--; newEnd--; }

  const deletedText = oldStr.slice(start, oldEnd);
  const insertedText = newStr.slice(start, newEnd);

  if (deletedText.length > 0) {
    ops.push({
      type: 'delete',
      position: start,
      text: '',
      length: deletedText.length,
      version,
      userId,
    });
  }

  if (insertedText.length > 0) {
    ops.push({
      type: 'insert',
      position: start,
      text: insertedText,
      length: 0,
      version,
      userId,
    });
  }

  return ops;
}

// Apply an OT operation to a string
export function applyOp(content, op) {
  if (op.type === 'insert') {
    const pos = Math.min(op.position, content.length);
    return content.slice(0, pos) + op.text + content.slice(pos);
  } else if (op.type === 'delete') {
    const pos = Math.min(op.position, content.length);
    const len = Math.min(op.length, content.length - pos);
    return content.slice(0, pos) + content.slice(pos + len);
  }
  return content;
}