import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Badge, Button, Card } from './design/components';
import './design/tokens.css';
import './design/jinu.css';
import './design/admin.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="ad-login">
      <Card title="커넥트 지누 어드민" action={<Badge tone="success">준비됨</Badge>}>
        <Button>들어가기</Button>
      </Card>
    </div>
  </StrictMode>,
);
