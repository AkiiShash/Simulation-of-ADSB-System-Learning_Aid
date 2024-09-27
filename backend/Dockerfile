# Use the official Python image as the base image
FROM python:3.11.0

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install necessary dependencies including MySQL client
# RUN apt-get update && apt-get install -y \
#     default-mysql-client \
#     && apt-get clean \
#     && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /code

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install dependencies
RUN pip install -r requirements.txt

# Expose the port the backend app runs on
EXPOSE 8001

# Command to run the backend server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]
