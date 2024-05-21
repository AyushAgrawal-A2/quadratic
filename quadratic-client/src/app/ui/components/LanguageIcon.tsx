import { colors } from '@/app/theme/colors';
import { Formula, JavaScript, MysqlIcon, PostgresIcon, Python } from '@/app/ui/icons';
import { Subject } from '@mui/icons-material';
import { SvgIconProps } from '@mui/material/SvgIcon';

export type Language = 'Python' | 'Formula' | 'Javascript' | 'POSTGRES' | 'MYSQL';

interface LanguageIconProps extends SvgIconProps {
  language?: Language;
}

export function LanguageIcon({ language, ...props }: LanguageIconProps) {
  return language === 'Python' ? (
    <Python sx={{ color: colors.languagePython }} {...props} />
  ) : language === 'Formula' ? (
    <Formula sx={{ color: colors.languageFormula }} {...props} />
  ) : language === 'Javascript' ? (
    <JavaScript className="text-gray-700" />
  ) : language === 'POSTGRES' ? (
    <PostgresIcon sx={{ color: colors.languagePostgres }} {...props} />
  ) : language === 'MYSQL' ? (
    <MysqlIcon sx={{ color: colors.languageMysql }} {...props} />
  ) : (
    <Subject {...props} />
  );
}
