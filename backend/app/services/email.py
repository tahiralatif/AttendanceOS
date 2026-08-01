"""Email service — mock for development."""
import logging

logger = logging.getLogger("email")


def send_invitation_email(email: str, name: str, token: str) -> str:
    """Log the invitation email (mock). In production, use SMTP."""
    link = f"https://attendance.14.jugaar.ai/invite?token={token}"
    logger.info(
        f"[EMAIL TO: {email}] Subject: You're invited to AttendanceOS\n"
        f"Hi {name},\n"
        f"You've been invited to join AttendanceOS.\n"
        f"Set your password here: {link}\n"
        f"This link expires in 7 days."
    )
    return link
