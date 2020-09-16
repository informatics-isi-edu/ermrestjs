# How to update documentations

This page will focus on what you need to consider when you've added some changes to
figure out whether you need to update any of the documents.

> The following sections were added to make sure you didn't miss any relevant piece of documentation and they are not necessarily applicable to your changes.

## Update API docs

After each change, make sure the api docs are updated, you can do so by running

```
$ make all
```

## Update annotation docs

If you changed any annotation-based feature, you need to make sure the [annotation doc](../user-docs/annotation.md) is updated and contains the latest information.

While updating this document make sure,

- You're following the same pattern in the document.

- Remove any internally deprecated feature, but leave any high-level deprecated annotation as is and just mark them as _deprecated_.

- Provide examples in a separate document if the annotation itself is complicated and requires more explanation.

- Try to keep the explanation in this doc short and navigate to another document for more information (if necessary.)

If you needed to update annotation document, you might need to do the following as well:

### Update other related documents

As it was suggested, there might be some documents under [user-docs folder](../user-docs) that were added to provide more information/examples to the users. If you changed a feature that has additional documents, make sure those are updated as well.


### Update the annotation validator in deriva-py

To allow data-modelers to validate their annotations, [deriva-py provides an annotation validator](https://github.com/informatics-isi-edu/deriva-py/blob/master/deriva/config/annotation_validate.py). To make sure the validator is based on the latest implementation of the code, you need to make sure deriva-py is updated as well.

#### How to install deriva-py for running the validator

If you're already familiar with deriva-py you can skip this section. This section is mainly for developers that are not familiar with python or deriva-py.

1. Make sure python is installed on your machine.

2. (optional but recommended) Create a virtual environment. There are multiple ways to do this. In here we're going to mention two of them:

    2.1. Using venv ([native to python](https://docs.python.org/3/tutorial/venv.html#creating-virtual-environments)):

    ```
    $ python -m venv some-new-env

    ```
    2.2. Using conda ([a third-party tool for python](https://docs.conda.io/en/latest/index.html)):
    ```
    $ conda create -n some-new-env python=3.7
    ```

3. (optional but recommended) If you've created a virtual environment, activate it:

    3.1. Using venv:

    On mac/linux
    ```
    $ source some-new-env/bin/activate
    ```
    On windows
    ```
    $ some-new-env\Scripts\activate.bat
    ```

    3.2. Using conda:

    ```
    $ conda activate some-new-env
    ```

4. Clone and install deriva-py:

    ```
    # clone the package
    $ git clone git@github.com:informatics-isi-edu/deriva-py.git

    # go to the folder
    $ cd deriva-py

    # install
    $ pip install -e .
    ```

    > By using `-e`, deriva will install by using a symbolic link to your working directory so anytime you change the code it is immediately reflected.

#### How to run the validator

You can find the instructions on how to run the validator [in here](https://docs.derivacloud.org/deriva-py/cli/deriva-annotation-validate.html).

#### How to update the validator

1. JSON schemas: The annotation validator uses [JSON Schema](https://json-schema.org/understanding-json-schema/). You don't need to know the whole syntax and you should be able to just modify the existing schemas. You can find the schemas under `deriva/core/schemas` folder.

2. Custom validators: In some rare cases, you might need to define a custom validator. These validators will help you to check for something other than the structure. For example if you want to make sure the colum name is valid, or the given source path is valid. You can find the existing custom validators under `deriva/core/annotation.py` file.
