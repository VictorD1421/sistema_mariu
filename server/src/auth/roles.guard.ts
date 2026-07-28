import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('No se encontró información de autenticación');
    }

    if (user.role === 'SUPERUSER') return true;

    if (user.isActive === false) {
      throw new UnauthorizedException('Tu cuenta ha sido inhabilitada');
    }

    if (!requiredRoles) return true;

    const hasRole = requiredRoles.includes(user.role);
    
    if (!hasRole) {
      throw new ForbiddenException(`Acceso denegado: Se requiere uno de estos roles: [${requiredRoles}]. Tu rol: ${user.role}`);
    }

    return true;
  }
}