call npm run build
call git subtree split --branch dist --prefix dist/
call git checkout origin dist
call git push origin dist
call git checkout origin master