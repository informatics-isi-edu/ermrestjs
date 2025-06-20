# How to update documentation materials

This page explains what documentation you may need to update after making code changes.

> The following sections were added to make sure you didn't miss any relevant piece of documentation and they are not necessarily applicable to your changes.

## Update annotation document

If you changed any annotation-based feature, you need to make sure the [annotation document](../user-docs/annotation.md) is updated and contains the latest information.

While updating this document make sure,

- You're following the same pattern in the document.

- Remove any internally deprecated feature, but leave any high-level deprecated annotation as is and just mark them as _deprecated_. Update [deprecated annotations document](../user-docs/annotation-deprecated.md) as necessary.

- Provide examples in a separate document if the annotation itself is complicated and requires more explanation. Make sure to have links from the annotation to the extra file.

- Try to keep the explanation in this doc short and navigate to another document for more information (if necessary.)

## Update other related documents

There might be some documents under [user-docs folder](../user-docs) that were added to provide more information/examples to the users. If you changed a feature that has additional documents, make sure those are updated as well.

## Update deriva-docs files

If you added any new files to the `user-docs`, make sure the [index.rst](../index.rst) is updated to include them. This file is used by deriva-docs to pull all the docs from this repository.


## Update the annotation validator in deriva-py

To allow data-modelers to validate their annotations, [deriva-py provides an annotation validator](https://github.com/informatics-isi-edu/deriva-py/blob/master/deriva/config/annotation_validate.py). To make sure the validator is based on the latest implementation of the code, you need to make sure deriva-py is updated as well.

### How to install deriva-py for running the validator

If you're already familiar with deriva-py you can skip this section. This section is mainly for developers that are not familiar with python or deriva-py.

1. Make sure python is installed on your machine.

2. (optional but recommended) Create a virtual environment. There are multiple ways to do this. In here we're going to mention two of them:

    2.1. Using venv ([native to python](https://docs.python.org/3/tutorial/venv.html#creating-virtual-environments)):

    ```sh
    python -m venv some-new-env
    ```
    2.2. Using conda ([a third-party tool for python](https://docs.conda.io/en/latest/index.html)):
    ```sh
    conda create -n some-new-env python=3.7
    ```

3. (optional but recommended) If you've created a virtual environment, activate it:

    3.1. Using venv:

    On mac/linux
    ```sh
    source some-new-env/bin/activate
    ```
    On windows
    ```sh
    some-new-env\Scripts\activate.bat
    ```

    3.2. Using conda:

    ```sh
    conda activate some-new-env
    ```

4. Clone and install deriva-py:

    ```sh
    # clone the package
    git clone git@github.com:informatics-isi-edu/deriva-py.git

    # go to the folder
    cd deriva-py

    # install
    pip install -e .
    ```

    > By using `-e`, deriva will install by using a symbolic link to your working directory so anytime you change the code it is immediately reflected.

### How to run the validator

You can find the instructions on how to run the validator [in here](https://docs.derivacloud.org/deriva-py/cli/deriva-annotation-validate.html).

### How to update the validator

1. JSON schemas: The annotation validator uses [JSON Schema](https://json-schema.org/understanding-json-schema/). You don't need to know the whole syntax and you should be able to just modify the existing schemas. You can find the schemas under `deriva/core/schemas` folder.

2. Custom validators: In some rare cases, you might need to define a custom validator. These validators will help you to check for something other than the structure. For example if you want to make sure the column name is valid, or the given source path is valid. You can find the existing custom validators under `deriva/core/annotation.py` file.
