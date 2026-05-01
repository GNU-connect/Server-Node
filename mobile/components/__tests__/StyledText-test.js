import * as React from 'react';
import renderer, { act } from 'react-test-renderer';

import { MonoText } from '../StyledText';

it(`정상적으로 렌더링된다`, async () => {
  let component;

  await act(async () => {
    component = renderer.create(<MonoText>Snapshot test!</MonoText>);
  });

  expect(component.toJSON()).toMatchSnapshot();

  await act(async () => {
    component.unmount();
  });
});
