import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  /** 입력창 오른쪽 끝에 붙는 버튼 등 */
  trailing?: ReactNode;
}

export function TextField({ id, label, trailing, className, ...input }: TextFieldProps) {
  return (
    <div className={cx('ad-field', className)}>
      <label className="ad-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="ad-field-box">
        <input id={id} className="ad-field-input" {...input} />
        {trailing}
      </div>
    </div>
  );
}
