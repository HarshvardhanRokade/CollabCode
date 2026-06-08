namespace CollabCode.API.Services;

public class Operation
{
    public string Type { get; set; } = string.Empty;     // "insert" or "delete"
    public int Position { get; set; }                     // where in the text
    public string Text { get; set; } = string.Empty;     // text to insert
    public int Length { get; set; }                       // how many chars to delete
    public int Version { get; set; }                      // document version
    public string UserId { get; set; } = string.Empty;   // who sent it
}

public class OTService
{
    // Transform incoming operation against a concurrent operation
    // so both changes are preserved correctly
    public Operation Transform(Operation incoming, Operation concurrent)
    {
        if (incoming.Type == "insert" && concurrent.Type == "insert")
        {
            // Both inserting — if concurrent is before or at same position,
            // shift incoming forward
            if (concurrent.Position <= incoming.Position)
                incoming.Position += concurrent.Text.Length;
        }
        else if (incoming.Type == "insert" && concurrent.Type == "delete")
        {
            // Concurrent deleted before our insert position — shift back
            if (concurrent.Position < incoming.Position)
                incoming.Position = Math.Max(
                    concurrent.Position,
                    incoming.Position - concurrent.Length
                );
        }
        else if (incoming.Type == "delete" && concurrent.Type == "insert")
        {
            // Concurrent inserted before our delete position — shift forward
            if (concurrent.Position <= incoming.Position)
                incoming.Position += concurrent.Text.Length;
        }
        else if (incoming.Type == "delete" && concurrent.Type == "delete")
        {
            // Both deleting
            if (concurrent.Position < incoming.Position)
            {
                incoming.Position = Math.Max(
                    concurrent.Position,
                    incoming.Position - concurrent.Length
                );
            }
            else if (concurrent.Position == incoming.Position)
            {
                // Same position — reduce length to avoid double delete
                incoming.Length = Math.Max(0, incoming.Length - concurrent.Length);
            }
        }

        return incoming;
    }

    // Apply an operation to a string and return the result
    public string Apply(string document, Operation op)
    {
        try
        {
            if (op.Type == "insert")
            {
                // Clamp position to valid range
                var pos = Math.Clamp(op.Position, 0, document.Length);
                return document.Insert(pos, op.Text);
            }
            else if (op.Type == "delete")
            {
                var pos = Math.Clamp(op.Position, 0, document.Length);
                var length = Math.Min(op.Length, document.Length - pos);
                if (length <= 0) return document;
                return document.Remove(pos, length);
            }
        }
        catch
        {
            // If anything goes wrong, return document unchanged
        }

        return document;
    }
}