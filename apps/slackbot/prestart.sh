
if [[ ! -e node_modules ]]; then
    mkdir node_modules
    echo "created node_modules folder"
fi

ln -sf ../../../packages/common/dist node_modules/common
echo "linked common package"