import sys, os, glob
here = os.path.dirname(os.path.abspath(__file__))
parts = sorted(glob.glob(os.path.join(here, 'p[0-9]*.js')))
code = '\n'.join(open(p, encoding='utf-8').read() for p in parts)
tpl = open(os.path.join(here, 'template.html'), encoding='utf-8').read()
assert tpl.count('/*@@CODE@@*/') == 1
out = tpl.replace('/*@@CODE@@*/', code.replace('</scr'+'ipt', '<\/scr'+'ipt'))
dest = r'C:\Users\Mi\OneDrive\Desktop\VS_Code\Haunted Hallways\index.html'
open(dest, 'w', encoding='utf-8').write(out)
print('built', len(parts), 'parts', len(out)//1024, 'KB')
