import dns.exception
import dns.resolver
from fastapi import HTTPException, status


def ensure_email_domain_accepts_mail(email: str) -> None:
    """Reject domains that DNS says cannot receive email.

    This validates the mail domain, not ownership of the individual mailbox.
    Mailbox ownership requires a separate verification-email workflow.
    """
    domain = email.rsplit("@", 1)[-1].rstrip(".")

    try:
        records = dns.resolver.resolve(domain, "MX", lifetime=4)
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Email domain does not accept email. Enter a valid email address."
        ) from None
    except (dns.exception.Timeout, dns.resolver.NoNameservers):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email domain could not be verified right now. Please try again."
        ) from None

    if not any(str(record.exchange).rstrip(".") for record in records):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Email domain does not accept email. Enter a valid email address."
        )
