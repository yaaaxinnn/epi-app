#!/bin/bash
cd /home/claude
for f in smoke.js regress.js t4.js t5.js t6.js t7.js t8.js t9.js t10.js t11.js t12.js t13.js t14.js t15.js t16.js t17.js t18.js t19.js t20.js t21.js t22.js t23.js t24.js t27.js t29.js audit.js layout.js layout2.js; do
  [ -f $f ] || continue
  out=$(timeout 120 node $f 2>&1); rc=$?
  last=$(echo "$out" | tail -1 | cut -c1-140)
  echo "$f rc=$rc :: $last"
done
