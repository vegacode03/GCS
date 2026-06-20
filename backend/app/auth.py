"""Validacao do token do Supabase.

Em vez de decodificar o JWT manualmente (que exige saber o algoritmo de
assinatura — HS256 no esquema antigo, ES256/RS256 no novo), pedimos ao
proprio Supabase para validar o token via auth.get_user(). Funciona com
qualquer esquema de assinatura do projeto.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .database import get_supabase

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Valida o access_token (Authorization: Bearer <token>) no Supabase.

    Retorna um dict com 'sub' (id do usuario) e 'email', compativel com o
    restante do backend que le user['sub'].
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacao ausente",
        )

    try:
        res = get_supabase().auth.get_user(credentials.credentials)
    except Exception as exc:  # AuthApiError, rede, etc.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido ou expirado",
        ) from exc

    user = getattr(res, "user", None)
    if user is None or not user.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido ou expirado",
        )

    return {"sub": user.id, "email": user.email}
