import React, {forwardRef} from 'react';

import {Chip} from '@material-ui/core';

export const Item = forwardRef(({label, style, ...props}, ref) => {
  return (
    <div style={{padding: 5, ...style}} {...props} ref={ref}>
      <Chip clickable label={label} size="small" />
    </div>
  );
});
