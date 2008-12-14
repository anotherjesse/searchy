task :default => [:xpi]

task :xpi do
  rm_f 'searchy.xpi'
  puts `find chrome chrome.manifest install.rdf | egrep -v '(#|~|DS_Store)' | xargs zip searchy.xpi`
end 
