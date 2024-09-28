# count_people

## Prerequisites

Make sure you have `poetry` and Python 3.11 installed

## Usage

First open a terminal and navigate to the project root.
Now install poetry dependencies by running\
`poetry install`

Then run `poetry run uvicorn object_detection_api.main:app --reload` to create the web app

Before commiting remember to run `poetry run pre-commit run --all-files` and `poetry run pytest` in order to test code and check that it follows style guidelines