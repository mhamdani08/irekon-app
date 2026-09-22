class CustomException(Exception):
    def __init__(self, message: str, status_code: int = 400, errors: list = None):
        self.message = message
        self.status_code = status_code
        self.errors = errors or []
        super().__init__(self.message)

class ValidationException(CustomException):
    def __init__(self, message: str = "Validation Error", errors: list = None):
        super().__init__(message=message, status_code=422, errors=errors)

class AuthenticationException(CustomException):
    def __init__(self, message: str = "Authentication Failed"):
        super().__init__(message=message, status_code=401)

class AuthorizationException(CustomException):
    def __init__(self, message: str = "Permission Denied"):
        super().__init__(message=message, status_code=403)

class BusinessException(CustomException):
    def __init__(self, message: str = "Business Rule Violation"):
        super().__init__(message=message, status_code=400)

class NotFoundException(CustomException):
    def __init__(self, message: str = "Resource Not Found"):
        super().__init__(message=message, status_code=404)
