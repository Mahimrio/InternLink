namespace InternLinkApi.Exceptions;

// Thrown when a requested application-status change isn't a valid forward transition.
// Controllers map this to 400 { error: "Invalid status transition" }.
public class InvalidStatusTransitionException : Exception
{
    public InvalidStatusTransitionException()
        : base("Invalid status transition")
    {
    }
}
