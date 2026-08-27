namespace InternLinkApi.Exceptions;

// Thrown by services when an authenticated caller is not allowed to act on a resource
// (e.g. editing a job owned by another company). Controllers map this to 403.
public class ForbiddenActionException : Exception
{
    public ForbiddenActionException(string message) : base(message)
    {
    }
}
