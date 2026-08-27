namespace InternLinkApi.Exceptions;

// Thrown by services for business-rule validation that data annotations can't express
// (e.g. deadline must be in the future). Controllers map this to 400 with field-level details.
public class ValidationFailedException : Exception
{
    public IReadOnlyDictionary<string, string> Errors { get; }

    public ValidationFailedException(string field, string message)
        : base(message)
    {
        Errors = new Dictionary<string, string> { [field] = message };
    }

    public ValidationFailedException(string message, IReadOnlyDictionary<string, string> errors)
        : base(message)
    {
        Errors = errors;
    }
}
