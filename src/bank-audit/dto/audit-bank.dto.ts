import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for auditing a bank (RULE 5 - Validation, non-blocking)
 */
export class AuditBankDto {
  @ApiProperty({
    description: 'Bank code (e.g., BCHILE, BESTADO, SANTANDER)',
    example: 'BCHILE',
  })
  @IsString()
  bankCode: string;

  @ApiProperty({
    description: 'Enable verbose logging',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  verbose?: boolean;
}

/**
 * DTO for creating/updating a bank
 */
export class CreateBankDto {
  @ApiProperty({
    description: 'Bank name',
    example: 'Banco de Chile',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Bank code (unique identifier)',
    example: 'BCHILE',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Bank login URL',
    example: 'https://login.portal.bancochile.cl',
  })
  @IsUrl()
  loginUrl: string;

  @ApiProperty({
    description: 'Bank description',
    example: 'Banco de Chile - Online Banking Portal',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Is bank active for auditing',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
