import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    jsx = f.read()

classes = set(re.findall(r'className=["\']([^"\']+)["\']', jsx))
template_classes = re.findall(r'className=\{`([^`]+)`\}', jsx)
for tc in template_classes:
    for part in re.split(r'\s+|\$\{[^\}]+\}', tc):
        if part.strip():
            classes.add(part.strip())

with open('frontend/src/App.css', 'r', encoding='utf-8') as f:
    css = f.read()

with open('frontend/src/index.css', 'r', encoding='utf-8') as f:
    index_css = f.read()

combined_css = css + '\n' + index_css

missing = []
for c in sorted(classes):
    for sub in c.split():
        if sub and not sub.startswith('$') and f'.{sub}' not in combined_css:
            missing.append(sub)

print('Missing classes from CSS:', sorted(set(missing)))
