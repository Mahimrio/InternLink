namespace InternLinkApi.Tests;

public class FakeTimeProvider : TimeProvider
{
    private DateTimeOffset _current;

    public FakeTimeProvider(DateTimeOffset? start = null)
    {
        _current = start ?? new DateTimeOffset(2026, 7, 14, 12, 0, 0, TimeSpan.Zero);
    }

    public override DateTimeOffset GetUtcNow() => _current;

    public void Advance(TimeSpan delta) => _current += delta;

    public void SetUtcNow(DateTimeOffset value) => _current = value;
}
